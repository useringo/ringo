//
//  ViewController.swift
//  Ringo-iOS
//
//  Created by Gautam Mittal on 5/23/15.
//  Copyright (c) 2015 Gautam Mittal. All rights reserved.
//

import UIKit

class ViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {

    
    @IBOutlet weak var tableView: UITableView!

    
    let defaults = NSUserDefaults.standardUserDefaults();
    
    
    
    var items: [String] = []
    

    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return self.items.count
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        
        var cell = (self.tableView.dequeueReusableCellWithIdentifier("cell") as UITableViewCell?)
        
        cell?.backgroundColor = UIColor(red: 246/255, green: 246/255, blue: 246/255, alpha: 1.0);
        
    
        
        cell!.textLabel?.text = self.items[indexPath.row]
        
        return cell!
        
    }
    
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        
        print("You selected cell #\(indexPath.row)!")
        
    }
    
    
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        var disk = defaults.objectForKey("savedSandboxes") as! NSDictionary;

        print(disk)
        
        for n in disk {
            print(n.key)
            items.append(n.key as! String)
            
            
        }
        
        self.tableView.registerClass(UITableViewCell.self, forCellReuseIdentifier: "cell")
        
        // Do any additional setup after loading the view, typically from a nib.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}

